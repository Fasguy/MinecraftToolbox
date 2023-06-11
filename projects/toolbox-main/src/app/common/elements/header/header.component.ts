import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from "@angular/core";
import { Route, Router, Routes } from "@angular/router";

@Component({
	selector: "tbx-header",
	templateUrl: "./header.component.html",
	styleUrls: ["./header.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements AfterViewInit {
	protected routes: Routes = [];

	@Input()
	public version!: string;

	public constructor(
		private _changeDetector: ChangeDetectorRef,
		router: Router
	) {
		this.routes.push(...router.config);
	}

	public ngAfterViewInit(): void {
		this._changeDetector.detach();
	}

	protected filterTitledRoutes(t: Route): boolean {
		return t.data?.["title"] != null;
	}
}