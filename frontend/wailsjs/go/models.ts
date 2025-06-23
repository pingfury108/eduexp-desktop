export namespace main {
	
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

