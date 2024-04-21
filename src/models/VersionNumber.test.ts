import { VersionNumber } from './VersionNumber';

describe('VersionNumber', () => {

    test('test good', () => {
        const versionNumber = new VersionNumber("1.2.3.4");
        expect(versionNumber.major).toBe(1);
        expect(versionNumber.minor).toBe(2);
        expect(versionNumber.patch).toBe(3);
        expect(versionNumber.enums).toBe(4);
    });

    test('test bad', () => {
        expect(() => new VersionNumber("1.2.3.e4")).toThrow("Invalid Version Number");
        expect(() => new VersionNumber("1.2.3")).toThrow("Invalid Version Number");
        expect(() => new VersionNumber("1.23.e4")).toThrow("Invalid Version Number");
        expect(() => new VersionNumber("1.23.4")).toThrow("Invalid Version Number");
    });

    test('test getString', () => {
        const versionNumber = new VersionNumber("1.2.3.4");
        expect(versionNumber.getShortVersionString()).toBe("1.2.3");
        expect(versionNumber.getVersionString()).toBe("1.2.3.4");
    });

    test('test isGreaterThan', () => {
        var v1 = new VersionNumber("1.0.0.0");
        var v2 = new VersionNumber("2.0.0.0");
        expect(v1.isGreaterThan("2.0.0.0")).toBeFalsy();
        expect(v2.isGreaterThan("1.0.0.0")).toBeTruthy();

        var v11 = new VersionNumber("1.1.0.0");
        var v12 = new VersionNumber("1.2.0.0");
        expect(v11.isGreaterThan("1.2.0.0")).toBeFalsy();
        expect(v12.isGreaterThan("1.1.0.0")).toBeTruthy();

        var v111 = new VersionNumber("1.1.1.0");
        var v112 = new VersionNumber("1.1.2.0");
        expect(v111.isGreaterThan("1.1.2.0")).toBeFalsy();
        expect(v112.isGreaterThan("1.1.1.0")).toBeTruthy();

        var v1111 = new VersionNumber("1.1.1.1");
        var v1112 = new VersionNumber("1.1.1.2");
        expect(v1111.isGreaterThan("1.1.1.2")).toBeFalsy();
        expect(v1112.isGreaterThan("1.1.1.1")).toBeTruthy();
    });

});