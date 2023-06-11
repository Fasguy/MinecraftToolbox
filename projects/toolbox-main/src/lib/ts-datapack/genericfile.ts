import { IFile } from "./interfaces/file";

export class GenericFile implements IFile {
	public name: string;
	public type: FileType;
	public data: DataType;

	constructor(name: string, type: FileType, data: DataType) {
		this.name = name;
		this.type = type;
		this.data = data;
	}

	public clone() {
		switch (this.type) {
			case "string":
				return new GenericFile(this.name, this.type, <string>this.data);
			case "json":
				return new GenericFile(this.name, this.type, JSON.parse(JSON.stringify(this.data)));
			case "binary":
				return new GenericFile(this.name, this.type, new Uint8Array(<Uint8Array>this.data));
			default:
				throw new Error(`Unknown file type: ${this.type}`);
		}
	}

	public serialize(): DataType {
		switch (this.type) {
			case "string":
				return <string>this.data;
			case "json":
				return JSON.stringify(this.data);
			case "binary":
				return <Uint8Array>this.data;
			default:
				throw new Error(`Unknown file type: ${this.type}`);
		}
	}
}

type DataType = string | Uint8Array | object;

type FileType = "string" | "json" | "binary";