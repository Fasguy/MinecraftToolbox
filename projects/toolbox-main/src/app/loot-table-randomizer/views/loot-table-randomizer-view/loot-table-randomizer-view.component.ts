import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ITool } from "src/app/common/interfaces/tool";
import { ActivityMonitorService } from "src/app/common/services/activity-monitor/activity-monitor.service";
import { AssetManagerService } from "src/app/common/services/asset-manager/asset-manager.service";
import { NetRequestService } from "src/app/common/services/net-request/net-request.service";
import { PanoramaService } from "src/app/common/services/panorama-service/panorama.service";
import { WindowService } from "src/app/common/services/window-service/window.service";
import { exportSettings, importSettings, mapFormData, mergeDeep, randomMinecraftSeed, seedHelper } from "src/lib/utils";
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
	public readonly version: string;
	public readonly tool: string = "loot-table-randomizer";

	protected lootTables!: EntryGroup[];

	protected seed: string = randomMinecraftSeed();

	protected meta: { additionals: Additional[] } = {
		additionals: []
	};

	public constructor(
		private _panorama: PanoramaService,
		private _randomizerService: LootTableRandomizerService,
		private _activityMonitor: ActivityMonitorService,
		private _netRequest: NetRequestService,
		private _assetManagerService: AssetManagerService,
		public window: WindowService,
		activatedRoute: ActivatedRoute,
		router: Router
	) {
		this.version = activatedRoute.snapshot.paramMap.get("version")!;

		//A simple compatibility rewrite, so that bookmarked links that end in ".X" get turned into ".0"
		if (this.version.endsWith(".X")) {
			this.version = this.version.substring(0, this.version.length - 2) + ".0";

			router.navigate([`../${this.version}`], { relativeTo: activatedRoute });
		}
	}

	public async ngOnInit() {
		await this._randomizerService.ngOnInit();

		this._panorama.setIndex(this.version);

		let data = await this._activityMonitor.startActivity({
			text: "Downloading necessary data...",
			promise: new Promise<Blob>((res, rej) => {
				this._netRequest.uncachedBlob(`resources/loot-table-randomizer/${this.version}/data.zip`)
					.subscribe({
						next: res,
						error: rej
					});
			})
		});

		await this._activityMonitor.startActivity({
			text: "Preparing necessary data pack data...",
			promise: new Promise<void>(async (res, rej) => {
				let blobMetaData = await this._randomizerService.loadDataFromBlob(data);

				this.meta = mergeDeep(this.meta, blobMetaData.meta);

				let entries: EntryGroup[] = [];

				await this._assetManagerService.loading;

				for (const group of Object.keys(blobMetaData.selection)) {
					entries.push({
						title: this._assetManagerService.getString(group),
						entries: blobMetaData.selection[group].map(x => {
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
			})
		});
	}

	protected onSubmit(e: SubmitEvent) {
		e.preventDefault();
		e.stopPropagation();

		let submittedData = mapFormData(<HTMLFormElement>e.target);

		let seed = seedHelper(submittedData["seed"]);

		this._randomizerService.randomize({
			seed: seed,
			dropChance100: submittedData["dropChance100"] === "on",
			deadEndIndicator: submittedData["deadEndIndicator"] === "on",
			selectedLootTables: submittedData["selection[]"]
		});
	}

	protected showInstructions() {
		this.window.createWindow(LootTableRandomizerInstructionsComponent);
	}

	protected showFAQ() {
		this.window.createWindow(LootTableRandomizerFAQComponent);
	}

	protected exportSettings = exportSettings.bind(this);

	protected importSettings = importSettings.bind(this);
}

interface Additional {
	header: string;
	content: string;
}