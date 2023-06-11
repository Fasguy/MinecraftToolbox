import { Injectable } from "@angular/core";
import { ActivityMonitorService } from "../activity-monitor/activity-monitor.service";
import { NetRequestService } from "../net-request/net-request.service";

@Injectable({
	providedIn: "root"
})
export class AssetManagerService {
	private _assets: any = {};
	private _loadingPromise: Promise<void>;

	public get loading() {
		return this._loadingPromise;
	}

	public constructor(
		private _netRequest: NetRequestService,
		activityMonitor: ActivityMonitorService
	) {
		this._loadingPromise = activityMonitor.startActivity({
			text: "Loading asset definitions...",
			promise: new Promise<void>((res, rej) => {
				this._netRequest.get<any>(`resources/data/asset_definitions.json`)
					.subscribe({
						next: assets => {
							this._assets = assets;
							res();
						},
						error: rej
					});
			})
		});
	}

	public async loadStrings(version: string) {
		// this.strings = await firstValueFrom(this._http.get<Dictionary<string>>(`resources/loot-table-randomizer/${version}/asset_definitions.json`));
	}

	public getString(key: string) {
		return this._assets[key]?.text ?? key;
	}
}
