import { IFile } from "./file";
import { IFileSystemEntry } from "./filesystementry";

export type IFolder = IFileSystemEntry & {
	get entries(): IFileSystemEntry[];

	get<TFileSystemType extends IFile>(name: string): TFileSystemType | undefined;

	set<TFileSystemType extends IFile>(entry: TFileSystemType): IFolder;

	delete<TFileSystemType extends IFile>(entry: TFileSystemType | string): boolean;
}