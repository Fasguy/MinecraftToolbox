import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from "@angular/core";
import { Route, Router, Routes } from "@angular/router";

@Component({
	selector: "tbx-header",
	templateUrl: "./header.component.html",
	styleUrls: ["./header.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements AfterViewInit {
	@ViewChild('overflowContainer')
	private _overflowContainer!: ElementRef<HTMLElement>;

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

		const observer = new ResizeObserver(entries => {
			const element = entries[0].target;
			element.classList.toggle("overflowing", element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth);
		});

		observer.observe(this._overflowContainer.nativeElement);
	}

	protected filterTitledRoutes(t: Route): boolean {
		return t.data?.["title"] != null;
	}

	protected scrollAlong(units: number): void {
		this._overflowContainer.nativeElement.scrollLeft += units;
	}
}