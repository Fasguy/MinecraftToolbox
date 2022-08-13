import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { strFromU8, unzip } from 'fflate';
import { ActivityMonitorService } from 'src/app/common/services/activity-monitor/activity-monitor.service';
import { AssetManagerService } from 'src/app/common/services/asset-manager/asset-manager.service';
import { PanoramaService } from 'src/app/common/services/panorama-service/panorama.service';
import { WindowService } from 'src/app/common/services/window-service/window.service';
import { GenericFile } from 'src/lib/ts-datapack/genericfile';
import { hashCode, tryParseInt } from 'src/lib/utils';
import { EntryGroup } from '../../../common/elements/selection/selection.component';
import { LootTableRandomizerService } from '../../services/loot-table-randomizer/loot-table-randomizer.service';
import { LootTableRandomizerFAQComponent } from '../frequently-asked-questions/frequently-asked-questions.component';
import { LootTableRandomizerInstructionsComponent } from '../instructions/instructions.component';

@Component({
	selector: 'tbx-loot-table-randomizer-view',
	templateUrl: './loot-table-randomizer-view.component.html',
	styleUrls: ['./loot-table-randomizer-view.component.scss'],
	providers: [LootTableRandomizerService]
})
export class LootTableRandomizerViewComponent implements OnInit {
	public lootTables!: EntryGroup[];

	public seed: string = (() => {
		let baseNumber = [...Array(19)].map(_ => Math.random() * 10 | 0).join('');
		return `${Math.random() < 0.5 ? "-" : ""}${baseNumber}`;
	})();

	constructor(
		private panorama: PanoramaService,
		private _activatedRoute: ActivatedRoute,
		private _http: HttpClient,
		private _randomizerService: LootTableRandomizerService,
		private _activityMonitor: ActivityMonitorService,
		private _window: WindowService,
		public assetManagerService: AssetManagerService
	) {
	}

	public ngOnInit(): void {
		let version = this._activatedRoute.snapshot.paramMap.get('version')!;

		this.panorama.setIndex(version);

		this._activityMonitor.startActivity({
			text: "Downloading necessary data...",
			promise: new Promise<void>((res, rej) => {
				let requestOptions: any = {
					responseType: 'arraybuffer',
					headers: new HttpHeaders({
						'Cache-Control': 'no-cache, no-store, must-revalidate, post-check=0, pre-check=0',
						'Pragma': 'no-cache',
						'Expires': '0'
					})
				};

				this._http.get(`resources/loot-table-randomizer/${version}/data.zip`, requestOptions)
					.subscribe({
						next: data => {
							unzip(new Uint8Array(data), (err, result) => {
								if (err) {
									rej(err);
									return;
								}

								this._activityMonitor.startActivity({
									text: "Preparing data pack...",
									promise: (async () => {
										//Set pre-determined data pack information
										let info: DatapackInformation = JSON.parse(strFromU8(result["info.json"]));
										this._randomizerService.dataPackInfo = {
											packFormat: info.packFormat,
											packPng: new GenericFile("pack.png", "binary", result["pack.png"])
										};
									})()
								});

								this._activityMonitor.startActivity({
									text: "Loading loot tables...",
									promise: (async () => {
										this._randomizerService.loadedLootTables = JSON.parse(strFromU8(result["loot_tables.json"]));
									})()
								});

								this._activityMonitor.startActivity({
									text: "Loading loot table selection list...",
									promise: (async () => {
										let dataJson: LootTableSelectionData = JSON.parse(strFromU8(result["selection_menu.json"]));

										let selectionList: EntryGroup[] = [];

										await this.assetManagerService.loading;

										for (const group of Object.keys(dataJson)) {
											selectionList.push({
												title: this.assetManagerService.getString(group),
												entries: dataJson[group].map(x => {
													return {
														text: this.assetManagerService.getString(x.assetId),
														value: x.value,
														checked: x.selected
													}
												})
											});
										}

										this.lootTables = selectionList;
									})()
								});

								res();
							});
						},
						error: rej
					});
			})
		});
	}

	reduceObjectKeys(prev: string, obj: any): string[] {
		let keys: string[] = [];

		for (const key of Object.keys(obj)) {
			if (!key.endsWith(".json")) {
				keys.push(...this.reduceObjectKeys(`${prev}${key}/`, obj[key]));
			}
			else {
				keys.push(prev + key);
			}
		}

		return keys;
	}

	public onSubmit(e: SubmitEvent) {
		e.preventDefault();
		e.stopPropagation();

		let formData = new FormData(<HTMLFormElement>e.target);
		let submittedData: any = {};

		let keys = new Set<string>([...formData].map(x => x[0]));
		for (const key of keys) {
			submittedData[key] = formData.getAll(key);
		}

		this._randomizerService.selectedLootTables = submittedData["selection"];

		//There's one thing to note about how seeds work here:
		//I wanted to emulate how Minecraft handles seeds as much as possible.
		//Therefore, the seed input is a string. If i can parse it to a Number, I'll use that.
		//Otherwise, i'll use the hash code of the string.
		//A problem arises with how JavaScript handles numbers.
		//We have a maximum safe integer precision of 53 bits, so we can't use the full range of numbers, that Minecraft would normally allow.
		//This means, that if we actually *have* a number that's outside those bounds, the last 3 digits will essentially be dropped.

		let seed = tryParseInt(<string>formData.get("seed"));
		if (seed.success) {
			this._randomizerService.randomize(seed.value);
		} else {
			this._randomizerService.randomize(hashCode(<string>formData.get("seed")));
		}
	}

	public showInstructions() {
		this._window.createWindow(LootTableRandomizerInstructionsComponent);
	}

	public showFAQ() {
		this._window.createWindow(LootTableRandomizerFAQComponent);
	}
}

interface LootTableSelectionData {
	[group: string]: LootTableSelectionEntry[];
}

interface LootTableSelectionEntry {
	selected: boolean;
	assetId: string;
	value: string;
}

interface DatapackInformation {
	packFormat: number;
}