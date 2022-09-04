import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { strFromU8, unzip } from 'fflate';
import { fflateZip } from '../../../../../../lib/fflate-zip';

@Component({
	selector: 'ltr-datapack-preparer',
	templateUrl: './datapack-preparer.component.html',
	styleUrls: ['./datapack-preparer.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LTR_DatapackPreparerComponent {
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

interface SelectionParameters {
	optGroup: string;
	value: string;
	assetId: string;
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
					loot_tables: _datapack["data"]["minecraft"]["loot_tables"]
				}
			}
		}
	}

	public async prepare() {
		const items = this._datapack["data"]["minecraft"]["loot_tables"];

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
			"loot_tables.json": this._datapack,
			"selection_menu.json": selectionMenu
		});

		let zip = new fflateZip();

		zip.add("data.zip", new Uint8Array(await dataZip.arrayBuffer()));
		zip.add("asset_definitions.json", this._assetDefinitions);

		this.finalFile = window.URL.createObjectURL(await zip.finalize());
	}

	private getGroupDefinition(folder: string) {
		return `toolbox:loot_table_randomizer_group_${folder}`;
	}

	private async extractGroupDefinitions(items: any) {
		let types = new Set<string>();

		for (let folder of Object.keys(items)) {
			if (Object.keys(items[folder]).length < 1) {
				//Not a folder, skip.
				continue;
			}
			types.add(folder);
		}

		for (const type of types) {
			this._groups.push(this.getGroupDefinition(type));
		}
	}

	private async generateAssetDefinitions(items: any) {
		let addedAssetDefinitions: any = document.querySelectorAll<HTMLInputElement>("input[name='missing_asset_definitions']");
		addedAssetDefinitions = Object.fromEntries([...addedAssetDefinitions].map(x => [x.id, { text: x.value }]));

		let assetDefinitionEntries = Object.entries<any>({ ...addedAssetDefinitions, ...this._assetDefinitions });

		let assetKeyList: string[] = [];

		for (let folder in items) {
			assetListGenerator(items[folder], "minecraft:");
		}

		assetKeyList.sort();

		for (let index of assetKeyList) {
			let searchMe = assetDefinitionEntries.filter(x => x[0] === index);

			if (searchMe.length === 0 || searchMe.length > 1) {
				console.log(`Could not find asset definition for ${index}`);
				this.missingAssetDefinitions.set(index, "");
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

		function assetListGenerator(list: any, key: string) {
			for (let file in list) {
				if (file.endsWith(".json")) {
					assetKeyList.push(key + file.replace(".json", ""));
				}
				else {
					assetListGenerator(list[file], key + file + "_");
				}
			}
		}
	}

	private async generateSelectionMenu(items: any) {
		let selectionMenu: any = {};

		for (let folder of Object.keys(items)) {
			if (Object.keys(items[folder]).length < 1) {
				//Not a folder, skip.
				continue;
			}
			optionGroupGenerator(items[folder], this._defaultSelectionExclusions, {
				optGroup: this.getGroupDefinition(folder),
				value: `data/minecraft/loot_tables/${folder}/`,
				assetId: "minecraft:"
			});
		}

		return selectionMenu;

		function optionGroupGenerator(list: any, defaultSelectionExclusions: string[], params: SelectionParameters) {
			selectionMenu[params.optGroup] = selectionMenu[params.optGroup] ?? [];

			for (let file in list) {
				if (file.endsWith(".json")) {
					let fullLootTableName = params.value + file;

					selectionMenu[params.optGroup].push({
						selected: !defaultSelectionExclusions.includes(fullLootTableName),
						assetId: params.assetId + file.replace(".json", ""),
						value: fullLootTableName
					});
				}
				else {
					optionGroupGenerator(list[file], defaultSelectionExclusions, {
						...params,
						value: `${params.value}${file}/`,
						assetId: `${params.assetId}${file}_`
					});
				}
			}
		}
	}
}