import { isHex } from "./helper";

export class Consoler<T extends string> {
  private password: string;
  private callbackFunction: ICallback | undefined;
  private verboseMode: IVerboseMode<T>[];
  private isDevelopment = process.env.NODE_ENV === "development";
  private isDebugModeEnable = !!this._getLocalVerbose();
  public tags: ITagFunctions<T> | undefined;

  constructor({
    password,
    defaultDeveloperMode,
    tags,
    onMessageCallback,
  }: IConsolerParams<T>) {
    this.password = password;
    this.verboseMode = defaultDeveloperMode;
    this.callbackFunction = onMessageCallback;
    this._setDefaultOptions();
    if (tags) {
      const tagsObj = this._getTagsObject(tags);
      this.tags = tagsObj;
    }
  }

  private _log(
    color: string,
    identifier: string,
    message?: unknown,
    ...optionalParams: unknown[]
  ): void {
    const { error } = this._getErrorTrace();
    const { recognizer, style } = this._getStylesOption(identifier, color);
    this.isDebugModeEnable &&
      console.groupCollapsed(recognizer, style, message, ...optionalParams);
    this.isDebugModeEnable && console.info(error);
    this.isDebugModeEnable && console.groupEnd();
  }
  private _taglog(
    color: string,
    identifier: string,
    message?: unknown,
    ...optionalParams: unknown[]
  ): void {
    const tag = this._searchInLocalVerbose(identifier.toUpperCase());
    tag &&
      this._log(color, "consoler:" + identifier, message, ...optionalParams);
    tag && this.callbackFunction?.(identifier.toUpperCase(), message);
  }
  private _getTagsObject(tags: IVerboseTag<T>[]) {
    const tagsFunctions = tags.map((tag) => {
      if (!isHex(tag.color)) {
        throw new Error("Tag Color in not Hex");
      }

      return {
        name: tag.displayName,
        function: (message?: unknown, ...optionalParams: unknown[]) =>
          this._taglog(tag.color, tag.displayName, message, ...optionalParams),
      };
    });
    const tagsObj = tagsFunctions.reduce(
      (a, v) => ({ ...a, [v.name]: v.function }),
      {}
    ) as ITagFunctions<T>;
    return tagsObj;
  }
  private _getErrorTrace() {
    let error: Error;
    try {
      throw new Error();
    } catch (er) {
      error = er as Error;
      error.name = "Trace";
    }
    return { error };
  }
  private _getStylesOption(identifier: string, color: string) {
    const recognizer = "%c" + `[${identifier}]`;
    const style = `color: white; background: ${color}; padding:1px 3px; border-radius:2px`;
    return { recognizer, style };
  }
  private _setDefaultOptions() {
    window.verbose = () => this._verbose();
    console.log("verbose now accessable!");
    this._addDefaultValue();
    if (this.isDebugModeEnable) {
      this.verboseMode = this._getLocalVerbose()?.split(
        ","
      ) as IVerboseMode<T>[];
      this.success(
        "Now you can see : (",
        this.verboseMode.toString(),
        ") logs."
      );
    }
  }
  private _autorizeDeveloper() {
    const exceptedPassword = this.password;
    if (this.isDevelopment) {
      return true;
    } else {
      const pass = prompt("Enter Your Development Password? ");
      console.log(pass);
      return pass === exceptedPassword;
    }
  }
  private _getVerboseMode() {
    const { promptMessage, tagsNames } = this._getPromptMessage();
    const mode = prompt(promptMessage)?.toUpperCase();
    const regex = this._getRegex(tagsNames);
    const verboseOptions = mode?.match(regex) as
      | IVerboseMode<T>[]
      | null
      | undefined;
    if (verboseOptions) {
      this.verboseMode = verboseOptions;
      return true;
    } else {
      alert("Wrong Verbose Mode!");
      return false;
    }
  }
  private _getPromptMessage() {
    let promptTagString = "";
    let tagsNames = undefined;
    if (this.tags) {
      tagsNames = Object.keys(this.tags);
      promptTagString =
        " available tags: \n " +
        tagsNames.map((tagName) => `🚀 ${tagName} \n`?.toUpperCase());
    }
    const promptMessage =
      "Enter verbose mode? options:(ex:'warn,Info,..'): \n 🔵 Info        🟠 Warn           🔴 Error       🟢 Success \n" +
      promptTagString;
    return { promptMessage, tagsNames };
  }

  private _getRegex(tagsNames?: string[]) {
    const staticRegStr = `(INFO)|(WARN)|(SUCCESS)|(ERROR)`;
    let regStr = staticRegStr;
    if (tagsNames) {
      regStr =
        staticRegStr +
        tagsNames
          .map((name) => `|(${name.toUpperCase()})`)
          .toString()
          .replace(",", "") +
        "";
    }
    const regex = new RegExp(regStr, "g");
    return regex;
  }
  private _setLocalVerbose() {
    localStorage.setItem("verbose", this.verboseMode.join(","));
    this.isDebugModeEnable = true;
  }
  private _getLocalVerbose() {
    const localverbose = localStorage.getItem("verbose");
    if (localverbose) {
      return localverbose.toUpperCase();
    }
  }
  private _searchInLocalVerbose(value: string) {
    const localverbose = this._getLocalVerbose();
    const refinedValue = value.toUpperCase();
    if (localverbose) {
      return !!localverbose.match(refinedValue);
    }
    return false;
  }
  private _addDefaultValue() {
    if (!this.isDebugModeEnable && this.isDevelopment) {
      this._setLocalVerbose();
    }
  }
  private _setVerboseAndReload() {
    this._setLocalVerbose();
    window.location.reload();
  }
  private _verbose() {
    const isAuthorized = this._autorizeDeveloper();
    if (isAuthorized) {
      console.log("Authorized");
      this._getVerboseMode() ? this._setVerboseAndReload() : null;
    } else {
      console.log("Not Authorized");
    }
  }
  //
  public log(message?: unknown, ...optionalParams: unknown[]): void {
    const info = this._searchInLocalVerbose("INFO");
    info && this._log("#03a9f4", "consoler:INFO", message, ...optionalParams);
    info && this.callbackFunction?.("INFO", message);
  }
  public warn(message?: unknown, ...optionalParams: unknown[]): void {
    const warn = this._searchInLocalVerbose("WARN");
    warn && this._log("#ffc107", "consoler:WARN", message, ...optionalParams);
    warn && this.callbackFunction?.("WARN", message);
  }
  public error(message?: unknown, ...optionalParams: unknown[]): void {
    const error = this._searchInLocalVerbose("ERROR");
    error && this._log("#f55656", "consoler:ERROR", message, ...optionalParams);
    error && this.callbackFunction?.("ERROR", message);
  }
  public success(message?: unknown, ...optionalParams: unknown[]): void {
    const success = this._searchInLocalVerbose("SUCCESS");
    success &&
      this._log("#19c720", "consoler:SUCCESS", message, ...optionalParams);
    success && this.callbackFunction?.("SUCCESS", message);
  }
}
