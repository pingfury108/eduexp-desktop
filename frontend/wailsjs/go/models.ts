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
	export class WorkflowConfig {
	    MaxConcurrentJobs: number;
	    JobTimeout: number;
	    RetryCount: number;
	    WorkspacePath: string;
	
	    static createFrom(source: any = {}) {
	        return new WorkflowConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.MaxConcurrentJobs = source["MaxConcurrentJobs"];
	        this.JobTimeout = source["JobTimeout"];
	        this.RetryCount = source["RetryCount"];
	        this.WorkspacePath = source["WorkspacePath"];
	    }
	}
	export class EduExpConfig {
	    ServerPort: string;
	    DataPath: string;
	    CacheEnabled: boolean;
	    BackupEnabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new EduExpConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ServerPort = source["ServerPort"];
	        this.DataPath = source["DataPath"];
	        this.CacheEnabled = source["CacheEnabled"];
	        this.BackupEnabled = source["BackupEnabled"];
	    }
	}
	export class GlobalConfig {
	    Theme: string;
	    Language: string;
	    AutoStart: boolean;
	    EnableNotifications: boolean;
	    LogLevel: string;
	    MaxLogEntries: number;
	
	    static createFrom(source: any = {}) {
	        return new GlobalConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Theme = source["Theme"];
	        this.Language = source["Language"];
	        this.AutoStart = source["AutoStart"];
	        this.EnableNotifications = source["EnableNotifications"];
	        this.LogLevel = source["LogLevel"];
	        this.MaxLogEntries = source["MaxLogEntries"];
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

