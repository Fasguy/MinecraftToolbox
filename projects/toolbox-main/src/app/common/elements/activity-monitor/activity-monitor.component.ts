import { Component, ElementRef, OnInit } from "@angular/core";
import { ActivityMonitorService } from "../../services/activity-monitor/activity-monitor.service";

@Component({
	selector: "tbx-activity-monitor",
	templateUrl: "./activity-monitor.component.html",
	styleUrls: ["./activity-monitor.component.scss"]
})
export class ActivityMonitorComponent implements OnInit {
	protected get activities() {
		return this._activityMonitor.activities;
	}

	public constructor(
		private _ref: ElementRef<HTMLElement>,
		private _activityMonitor: ActivityMonitorService
	) {
	}

	public set enabled(enabled: boolean) {
		this._ref.nativeElement.style.display = enabled ? "block" : "none";
	}

	public ngOnInit(): void {
		this._activityMonitor.setActivityMonitor(this);
	}
}