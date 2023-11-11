import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ITool } from "src/app/common/interfaces/tool";
import { ActivityMonitorService } from "src/app/common/services/activity-monitor/activity-monitor.service";
import { AssetManagerService } from "src/app/common/services/asset-manager/asset-manager.service";
import { NetRequestService } from "src/app/common/services/net-request/net-request.service";
import { PanoramaService } from "src/app/common/services/panorama-service/panorama.service";
import { WindowService } from "src/app/common/services/window-service/window.service";
import { DownloadComponent } from "src/app/common/views/windows/download/download.component";
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
				this._netRequest.uncachedBlob(`media/loot-table-randomizer/${this.version}/data.zip`)
					.subscribe({
						next: res,
						error: rej
					});
			})
		});

		await this._activityMonitor.startActivity({
			text: "Preparing necessary data pack data...",
			promise: (async () => {
				let { meta, selection, loadedFiles } = await this._randomizerService.loadDataFromBlob(data);

				this.meta = mergeDeep(this.meta, meta);

				let entries: EntryGroup[] = [];

				await this._assetManagerService.loading;

				/*
					Match1: Namespace
					Match2: Group
					Match3: Loot-Table
				*/
				let selectionRegex = /^data\/([^\/\n]*)\/loot_tables\/([^\/\n]*)\/([^\n]*)\.json$/gm;
				let groupsInLoadedFiles = loadedFiles.join("\n").matchAll(selectionRegex);
				let selectionList = [...groupsInLoadedFiles].groupBy(x => x[2]);

				for (const [key, entry] of selectionList) {
					let groupAssetDefinition = `toolbox:loot_table_randomizer_group_${key}`;

					entries.push({
						title: this._assetManagerService.getString(groupAssetDefinition),
						entries: entry.map(x => {
							let namespace = x[1];
							let assetId = x[3].replace("/", "_");

							return {
								text: this._assetManagerService.getString(`${namespace}:${assetId}`),
								value: x[0],
								checked: !selection.unselected.includes(x[0])
							};
						})
					});
				}

				this.lootTables = entries;
			})()
		});
	}

	protected async onSubmit(e: SubmitEvent) {
		e.preventDefault();
		e.stopPropagation();

		let submittedData = mapFormData(<HTMLFormElement>e.target);

		let seed = seedHelper(submittedData["seed"]);

		const output = await this._randomizerService.randomize({
			seed: seed,
			dropChance100: submittedData["dropChance100"] === "on",
			deadEndIndicator: submittedData["deadEndIndicator"] === "on",
			selectedLootTables: submittedData["selection[]"]
		});

		let downloadComponent = this.window.createWindow(DownloadComponent).instance;
		downloadComponent.href = output.href;
		downloadComponent.name = output.filename;
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