/**
 * This is a simple class that implements a comparable, 
 * four digit, semantic version number.
 */
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

    /**
     * Comparison operator
     * @param compareto 
     * @returns True if the value provided is greater than this
     */
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

    // Simple getter for three character version
    public getShortVersionString(): string {
        return this.major + "." + this.minor +  "." + this.patch;
    }

    // Simple getter for full version
    public getVersionString(): string {
        return this.getShortVersionString() + "." + this.enums;
    }
}
