import { VersionNumber } from '../../src/models/VersionNumber';

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
});