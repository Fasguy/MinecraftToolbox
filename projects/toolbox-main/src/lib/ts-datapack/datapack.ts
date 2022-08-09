import { duckCheck } from "../utils";
import { GenericFolder } from "./genericfolder";
import { IFileSystemEntry } from "./interfaces/filesystementry";
import { IFolder } from "./interfaces/folder";
import { Pack_MCMeta } from "./pack_mcmeta";

export class Datapack extends GenericFolder {
	protected override _entries: Set<IFileSystemEntry> = new Set([
		new Pack_MCMeta(),
		new GenericFolder("data")
	]);

	public override name: string = "";

	public get "pack.mcmeta"() {
		return this.get<Pack_MCMeta>("pack.mcmeta")!;
	}

	public get data() {
		return this.get<GenericFolder>("data")!;
	}

	public constructor() {
		super("");
	}

	public get allFilePaths(): string[] {
		function reduceToPaths(entries: IFileSystemEntry[], depthString: string): string[] {
			let paths: string[] = [];

			for (const entry of entries) {
				if (duckCheck(entry, "entries")) {
					paths.push(...reduceToPaths((<IFolder>entry).entries, `${depthString}${entry.name}/`));
				}
				else {
					paths.push(`${depthString}${entry.name}`);
				}
			}

			return paths;
		}

		return reduceToPaths(this.entries, "");
	}
}