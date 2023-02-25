import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";
import { strFromU8, unzip } from "fflate";
import { fflateZip } from "../../../../../../lib/fflate-zip";

@Component({
	selector: "crr-datapack-preparer",
	templateUrl: "./datapack-preparer.component.html",
	styleUrls: ["./datapack-preparer.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CRR_DatapackPreparerComponent {
	private preparer!: DatapackPreparer;

	public finalFile?: string;

	public get missingAssetDefinitions() {
		return this.preparer?.missingAssetDefinitions ?? [];
	}

	constructor(
		private _changeDetector: ChangeDetectorRef
	) {
	}

	public async prepare(e: Event) {
		e.preventDefault();
		e.stopPropagation();

		let data = new Map([...new FormData(<HTMLFormElement>e.target)]);

		let datapackData = <File>data.get("datapack")!;
		let assetDefinitionsData = <File>data.get("asset_definitions")!;
		let defaultSelectionExclusionsData = <File>data.get("unselected")!;

		let datapackObject = await convertZipToObject(await readFileBuffer(datapackData));
		let assetDefinitionsObject = JSON.parse(await readFileString(assetDefinitionsData));
		let defaultSelectionExclusionsArray = JSON.parse(await readFileString(defaultSelectionExclusionsData));

		this.preparer = new DatapackPreparer(datapackObject, assetDefinitionsObject, defaultSelectionExclusionsArray);
		await this.preparer.prepare();

		this.finalFile = this.preparer.finalFile;

		this._changeDetector.detectChanges();
	}
}

function convertZipToObject(zip: ArrayBuffer) {
	let datapackObject: any = {};

	unzip(new Uint8Array(zip), (err, result) => {
		if (err) {
			throw err;
		}

		for (const [relativePath, zipObject] of Object.entries(result)) {
			//If we're dealing with a non-JSON file, skip.
			if (!relativePath.endsWith(".json")) continue;

			let folders = relativePath.split("/");
			let fileName = folders.pop()!;

			let dataObject = datapackObject;

			for (let path of folders) {
				dataObject[path] = dataObject[path] ?? {};
				dataObject = dataObject[path];
			}

			dataObject[fileName] = JSON.parse(strFromU8(zipObject));
		}
	});

	return datapackObject;
}

async function readFileBuffer(file: File) {
	return new Promise<ArrayBuffer>((res, rej) => {
		let reader = new FileReader();

		reader.addEventListener("load", () => res(<ArrayBuffer>reader.result));
		reader.addEventListener("error", () => rej(reader.error));

		reader.readAsArrayBuffer(file);
	});
}

async function readFileString(file: File) {
	return new Promise<string>((res, rej) => {
		let reader = new FileReader();

		reader.addEventListener("load", () => res(<string>reader.result));
		reader.addEventListener("error", () => rej(reader.error));

		reader.readAsText(file, "utf8");
	});
}

async function dataToZip(files: FileDefinition) {
	let zip = new fflateZip();
	for (const file in files) {
		zip.add(file, files[file]);
	}

	return zip.finalize();
}

interface FileDefinition {
	[key: string]: {}
}

class DatapackPreparer {
	private finalizable: boolean = true;

	private _groups: string[] = [];

	public missingAssetDefinitions = new Map<string, string>();

	public finalFile: string | undefined;

	public constructor(
		private _datapack: any,
		private _assetDefinitions: any,
		private _defaultSelectionExclusions: any[]
	) {
		//Remove irrelevant entries from datapack object.
		this._datapack = {
			data: {
				minecraft: {
					recipes: _datapack["data"]["minecraft"]["recipes"]
				}
			}
		}
	}

	public async prepare() {
		const items = this.removeUnusableRecipes(this._datapack["data"]["minecraft"]["recipes"]);

		this.extractGroupDefinitions(items);
		this.generateAssetDefinitions(items);

		if (!this.finalizable) {
			return;
		}

		let selectionMenu = await this.generateSelectionMenu(items);
		for (const key of Object.keys(selectionMenu)) {
			selectionMenu[key].sort((a: any, b: any) => a.assetId.localeCompare(b.assetId));
		}

		let dataZip = await dataToZip({
			"recipes.json": this._datapack,
			"selection_menu.json": selectionMenu
		});

		let zip = new fflateZip();

		zip.add("data.zip", new Uint8Array(await dataZip.arrayBuffer()));
		zip.add("asset_definitions.json", this._assetDefinitions);

		this.finalFile = window.URL.createObjectURL(await zip.finalize());
	}

	private removeUnusableRecipes(recipes: any) {
		let usableRecipes: any = {};

		for (let fileName of Object.keys(recipes)) {
			let file = recipes[fileName];

			if (file["result"]) {
				usableRecipes[fileName] = file;
			}
		}

		return usableRecipes;
	}

	private getGroupDefinition(type: string) {
		type = type.split(":")[1] ?? type;
		if (type.startsWith("crafting")) {
			//Any kind of general crafting is just grouped together under the "crafting" group.
			type = "crafting";
		}

		return `toolbox:crafting_recipes_randomizer_group_${type}`;
	}

	private async extractGroupDefinitions(items: any) {
		let types = new Set<string>();

		for (let item of Object.values<any>(items)) {
			types.add(item["type"]);
		}

		for (const type of types) {
			this._groups.push(this.getGroupDefinition(type));
		}
	}

	private async generateAssetDefinitions(items: any) {
		let addedAssetDefinitions: any = document.querySelectorAll<HTMLInputElement>("input[name='missing_asset_definitions']");
		addedAssetDefinitions = Object.fromEntries([...addedAssetDefinitions].map(x => [x.id, { text: x.value }]));

		let assetDefinitionEntries = Object.entries<any>({ ...addedAssetDefinitions, ...this._assetDefinitions });

		for (let fileName of Object.keys(items)) {
			let file = items[fileName];

			let searchable: string = "";
			if (typeof file["result"] === "string") {
				searchable = file["result"];
			} else if (typeof file["result"] === "object") {
				searchable = file["result"]["item"];
			} else {
				this._defaultSelectionExclusions.push(`data/minecraft/recipes/${fileName}`);
				continue;
			}

			let searchMe = assetDefinitionEntries.filter(x => x[0] === searchable);

			if (searchMe.length === 0 || searchMe.length > 1) {
				console.log(`Could not find asset definition for ${searchable}`);
				this.missingAssetDefinitions.set(searchable, "");
			}
		}

		for (let group of this._groups) {
			let searchMe = assetDefinitionEntries.filter(x => x[0] === group);

			if (searchMe.length === 0 || searchMe.length > 1) {
				console.log(`Could not find asset definition for ${group}`);
				this.missingAssetDefinitions.set(group, "");
			}
		}

		if (this.missingAssetDefinitions.size > 0) {
			this.finalizable = false;
		}

		this._assetDefinitions = Object.fromEntries(assetDefinitionEntries);
	}

	private getResultingItem(recipe: any) {
		if (typeof recipe["result"] === "string") {
			return recipe["result"];
		} else if (typeof recipe["result"] === "object") {
			return recipe["result"]["item"];
		} else {
			return "";
		}
	}

	private async generateSelectionMenu(items: any) {
		let selectionMenu: any = {};

		for (const fileName of Object.keys(items)) {
			let item = items[fileName];

			let optGroup = this.getGroupDefinition(item["type"]);

			selectionMenu[optGroup] = selectionMenu[optGroup] ?? [];

			selectionMenu[optGroup].push({
				selected: !this._defaultSelectionExclusions.includes(fileName),
				assetId: this.getResultingItem(item),
				value: `data/minecraft/recipes/${fileName}`
			});
		}

		return selectionMenu;
	}
}