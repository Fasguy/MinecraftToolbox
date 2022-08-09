import { IFileSystemEntry } from "./interfaces/filesystementry";
import { IFolder } from "./interfaces/folder";

export class GenericFolder implements IFolder {
	protected _entries: Set<IFileSystemEntry> = new Set();

	public name: string;

	public get entries(): IFileSystemEntry[] {
		return Array.from(this._entries);
	}

	public constructor(name: string) {
		this.name = name;
	}

	public get<TFileSystemType extends IFileSystemEntry>(name: string): TFileSystemType | undefined {
		let { isMultipath, entry } = this.getMultiPathEntry(name);
		if (isMultipath) {
			return entry as TFileSystemType;
		}

		const predicate = (entry: IFileSystemEntry) => entry.name === name;
		for (let x of this._entries) {
			if (predicate(x)) {
				return x as TFileSystemType;
			}
		}

		return undefined;
	}

	private getMultiPathEntry(name: string): { isMultipath: boolean, entry: IFileSystemEntry | undefined } {
		let pathParts = name.split("/");
		if (pathParts.length > 1) {
			return {
				isMultipath: true,
				entry: this.get<IFolder>(pathParts[0])?.get(pathParts.slice(1).join("/"))
			};
		}

		return { isMultipath: false, entry: undefined };
	}

	public set<TFileSystemType extends IFileSystemEntry>(entry?: TFileSystemType): this {
		if (!entry) return this;

		if (this.setMultiPathEntry(entry)) return this;

		let existing = this.get(entry.name);
		if (existing) {
			this._entries.delete(existing);
		}

		this._entries.add(entry);

		return this;
	}

	private setMultiPathEntry(entry: IFileSystemEntry) {
		let pathParts = entry.name.split("/");
		if (pathParts.length > 1) {
			entry.name = pathParts.slice(1).join("/");

			let existing = this.get<IFolder>(pathParts[0]);
			if (existing) {
				existing.set(entry);
			}
			else {
				let newFolder = new GenericFolder(pathParts[0]);
				this.set(newFolder);
				newFolder.set(entry);
			}

			return true;
		}

		return false;
	}

	public delete<TFileSystemType extends IFileSystemEntry>(entry: TFileSystemType | string): boolean {
		let entryPath;

		switch (typeof entry) {
			case "string":
				let realEntry = this.get(entry);
				if (realEntry && this._entries.has(realEntry)) {
					return this._entries.delete(realEntry);
				}

				entryPath = entry;
				break;
			case "object":
				if (this._entries.has(entry)) {
					return this._entries.delete(entry);
				}

				entryPath = entry.name;
				break;
		}

		return this.deleteMultiPathEntry(entryPath);
	}

	private deleteMultiPathEntry(entryPath: string) {
		let pathParts = entryPath.split("/");
		if (pathParts.length > 1) {
			entryPath = pathParts.slice(1).join("/");

			let existing = this.get<IFolder>(pathParts[0]);
			if (existing) {
				existing.delete(entryPath);
			}
			else {
				return false;
			}

			return true;
		}

		return false;
	}

	public serialize(): { [key: string]: any } {
		let result: any = {};
		for (let x of this._entries) {
			result[x.name] = x.serialize();
		}

		return result;
	}
}