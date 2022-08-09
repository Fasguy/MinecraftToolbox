import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { randomRange } from 'src/lib/utils';

@Component({
	selector: 'tbx-loading-indicator',
	templateUrl: './loading-indicator.component.html',
	styleUrls: ['./loading-indicator.component.scss']
})
export class LoadingIndicatorComponent implements AfterViewInit {
	@ViewChild("item")
	private item!: ElementRef<HTMLDivElement>;

	ngAfterViewInit(): void {
		this.item.nativeElement.addEventListener("animationiteration", (e) => {
			(<HTMLDivElement>e.target).style.backgroundPositionX = `calc(100% * ${randomRange(0, 3)})`;
		});
	}
}