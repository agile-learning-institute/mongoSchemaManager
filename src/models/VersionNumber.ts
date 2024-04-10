
export class VersionNumber {
    public major: number;
    public minor: number;
    public patch: number;
    public enums: number;

    /**
     * Parses a version string with 4 parts major.minor.patch.enum
     * @param versionString 
     */
    constructor(versionString: string) {
        if (versionString === undefined) {
            throw new Error("Invalid Version Number is undefined")
        }
        const numbers: number[] = versionString.split('.').map(Number);
        if (numbers.some(isNaN)) {
            throw new Error("Invalid Version Number")
        }
        if (numbers.length != 4) {
            throw new Error("Invalid Version Number")
        }
        this.major = numbers[0];
        this.minor = numbers[1];
        this.patch = numbers[2];
        this.enums = numbers[3];
    }

    public isGreaterThan(compareto: string): boolean {
        const that = new VersionNumber(compareto);

        if (this.major > that.major) return true;
        if (this.major < that.major) return false;

        if (this.minor > that.minor) return true;
        if (this.minor < that.minor) return false;

        if (this.patch > that.patch) return true;
        if (this.patch < that.patch) return false;

        if (this.enums > that.enums) return true;
        if (this.enums < that.enums) return false;

        return false;
    }

    public getShortVersionString(): string {
        return this.major + "." + this.minor +  "." + this.patch;
    }

    public getVersionString(): string {
        return this.getShortVersionString() + "." + this.enums;
    }
}
