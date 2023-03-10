import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { strFromU8, unzip } from "fflate";
import { ITool } from "src/app/common/interfaces/tool";
import { ActivityMonitorService } from "src/app/common/services/activity-monitor/activity-monitor.service";
import { AssetManagerService } from "src/app/common/services/asset-manager/asset-manager.service";
import { NetRequestService } from "src/app/common/services/net-request/net-request.service";
import { PanoramaService } from "src/app/common/services/panorama-service/panorama.service";
import { WindowService } from "src/app/common/services/window-service/window.service";
import { exportSettings, hashCode, importSettings, mapFormData, randomMinecraftSeed, tryParseInt } from "src/lib/utils";
import { EntryGroup } from "../../../common/elements/selection/selection.component";
import { LootTableRandomizerService } from "../../services/loot-table-randomizer/loot-table-randomizer.service";
import { LootTableRandomizerFAQComponent } from "../frequently-asked-questions/frequently-asked-questions.component";
import { LootTableRandomizerInstructionsComponent } from "../instructions/instructions.component";


@Component({
	selector: "tbx-loot-table-randomizer-view",
	templateUrl: "./loot-table-randomizer-view.component.html",
	styleUrls: ["./loot-table-randomizer-view.component.scss"],
	providers: [LootTableRandomizerService]
})
export class LootTableRandomizerViewComponent implements OnInit, ITool {
	public version: string = "";
	public tool: string = "loot-table-randomizer";

	protected lootTables!: EntryGroup[];

	protected seed: string = randomMinecraftSeed();

	constructor(
		private _panorama: PanoramaService,
		private _activatedRoute: ActivatedRoute,
		private _randomizerService: LootTableRandomizerService,
		private _activityMonitor: ActivityMonitorService,
		private _netRequest: NetRequestService,
		private _assetManagerService: AssetManagerService,
		public window: WindowService
	) {
	}

	public async ngOnInit() {
		this.version = this._activatedRoute.snapshot.paramMap.get("version")!;

		await this._randomizerService.ngOnInit();

		this._panorama.setIndex(this.version);

		let data = await this._activityMonitor.startActivity({
			text: "Downloading necessary data...",
			promise: new Promise<ArrayBuffer>((res, rej) => {
				this._netRequest.binary(`resources/loot-table-randomizer/${this.version}/data.zip`)
					.subscribe({
						next: res,
						error: rej
					});
			})
		});

		let dataCopy = new Uint8Array(new ArrayBuffer(data.byteLength));
		dataCopy.set(new Uint8Array(data));

		await this._assetManagerService.loading;

		await this._activityMonitor.startActivity({
			text: "Preparing necessary data pack data...",
			promise: new Promise<void>(async (res, rej) => {
				unzip(dataCopy, (err, result) => {
					if (err) {
						rej(err);
						return;
					}

					let dataJson: LootTableSelectionData = JSON.parse(strFromU8(result["selection_menu.json"]));

					let entries: EntryGroup[] = [];

					for (const group of Object.keys(dataJson)) {
						entries.push({
							title: this._assetManagerService.getString(group),
							entries: dataJson[group].map(x => {
								return {
									text: this._assetManagerService.getString(x.assetId),
									value: x.value,
									checked: x.selected
								}
							})
						});
					}

					this.lootTables = entries;

					res();
				});

				await this._randomizerService.loadDatapackFiles(dataCopy);
			})
		});
	}

	public onSubmit(e: SubmitEvent) {
		e.preventDefault();
		e.stopPropagation();

		let submittedData = mapFormData(<HTMLFormElement>e.target);

		//There's one thing to note about how seeds work here:
		//I wanted to emulate how Minecraft handles seeds as much as possible.
		//Therefore, the seed input is a string. If i can parse it to a Number, I'll use that.
		//Otherwise, i'll use the hash code of the string.
		//A problem arises with how JavaScript handles numbers.
		//We have a maximum safe integer precision of 53 bits, so we can't use the full range of numbers, that Minecraft would normally allow.
		//This means, that if we actually *have* a number that's outside those bounds, the last 3 digits will essentially be dropped.

		let parsedSeed = tryParseInt(submittedData["seed"]);
		let seed: number;

		if (parsedSeed.success) {
			seed = parsedSeed.value;
		} else {
			seed = hashCode(submittedData["seed"]);
		}

		this._randomizerService.randomize({
			seed: seed,
			dropChance100: submittedData["dropChance100"] === "on",
			selectedLootTables: submittedData["selection[]"]
		});
	}

	public showInstructions() {
		this.window.createWindow(LootTableRandomizerInstructionsComponent);
	}

	public showFAQ() {
		this.window.createWindow(LootTableRandomizerFAQComponent);
	}

	protected exportSettings = exportSettings.bind(this);

	protected importSettings = importSettings.bind(this);
}

interface LootTableSelectionData {
	[group: string]: LootTableSelectionEntry[];
}

interface LootTableSelectionEntry {
	selected: boolean;
	assetId: string;
	value: string;
}