export namespace main {
	
	export class LicenseConfig {
	    LicenseKey: string;
	    ExpiryDate: string;
	    UserLimit: number;
	    FeatureFlags: string[];
	
	    static createFrom(source: any = {}) {
	        return new LicenseConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.LicenseKey = source["LicenseKey"];
	        this.ExpiryDate = source["ExpiryDate"];
	        this.UserLimit = source["UserLimit"];
	        this.FeatureFlags = source["FeatureFlags"];
	    }
	}
	export class WorkflowParameter {
	    Key: string;
	    Label: string;
	    Type: string;
	    Required: boolean;
	    Options: string[];
	    DefaultValue: string;
	
	    static createFrom(source: any = {}) {
	        return new WorkflowParameter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Key = source["Key"];
	        this.Label = source["Label"];
	        this.Type = source["Type"];
	        this.Required = source["Required"];
	        this.Options = source["Options"];
	        this.DefaultValue = source["DefaultValue"];
	    }
	}
	export class WorkflowDef {
	    Name: string;
	    WorkflowID: string;
	    AppID: string;
	    Parameters: WorkflowParameter[];
	
	    static createFrom(source: any = {}) {
	        return new WorkflowDef(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.WorkflowID = source["WorkflowID"];
	        this.AppID = source["AppID"];
	        this.Parameters = this.convertValues(source["Parameters"], WorkflowParameter);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class WorkflowConfig {
	    ApiKey: string;
	    Workflows: Record<string, WorkflowDef>;
	
	    static createFrom(source: any = {}) {
	        return new WorkflowConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ApiKey = source["ApiKey"];
	        this.Workflows = this.convertValues(source["Workflows"], WorkflowDef, true);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class EduExpConfig {
	    ArkApiKey: string;
	    ArkModeModel: string;
	    ArkOcrModeModel: string;
	    ArkTextModeModel: string;
	
	    static createFrom(source: any = {}) {
	        return new EduExpConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ArkApiKey = source["ArkApiKey"];
	        this.ArkModeModel = source["ArkModeModel"];
	        this.ArkOcrModeModel = source["ArkOcrModeModel"];
	        this.ArkTextModeModel = source["ArkTextModeModel"];
	    }
	}
	export class GlobalConfig {
	    Theme: string;
	
	    static createFrom(source: any = {}) {
	        return new GlobalConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Theme = source["Theme"];
	    }
	}
	export class Config {
	    Global: GlobalConfig;
	    EduExp: EduExpConfig;
	    Workflow: WorkflowConfig;
	    License: LicenseConfig;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Global = this.convertValues(source["Global"], GlobalConfig);
	        this.EduExp = this.convertValues(source["EduExp"], EduExpConfig);
	        this.Workflow = this.convertValues(source["Workflow"], WorkflowConfig);
	        this.License = this.convertValues(source["License"], LicenseConfig);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	export class ProcessConfig {
	    Name: string;
	    Command: string;
	    Args: string[];
	    WorkDir: string;
	
	    static createFrom(source: any = {}) {
	        return new ProcessConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Command = source["Command"];
	        this.Args = source["Args"];
	        this.WorkDir = source["WorkDir"];
	    }
	}
	
	

}

