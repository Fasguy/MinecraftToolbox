import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { randomRange } from 'src/lib/utils';

@Component({
	selector: 'tbx-loading-indicator',
	templateUrl: './loading-indicator.component.html',
	styleUrls: ['./loading-indicator.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingIndicatorComponent implements AfterViewInit {
	@ViewChild("item")
	private item!: ElementRef<HTMLDivElement>;

	public ngAfterViewInit(): void {
		let animationListener = (e: AnimationEvent) => {
			(<HTMLDivElement>e.target).style.backgroundPositionX = `calc(100% * ${randomRange(0, 3)})`;
		};

		this.item.nativeElement.addEventListener("animationstart", animationListener);
		this.item.nativeElement.addEventListener("animationiteration", animationListener);
	}
}