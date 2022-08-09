import { ISerializable } from "./serializable";

export type IFileSystemEntry = ISerializable & {
	name: string;
}