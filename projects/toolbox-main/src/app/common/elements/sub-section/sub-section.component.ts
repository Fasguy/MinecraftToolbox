import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'tbx-sub-section',
	templateUrl: './sub-section.component.html',
	styleUrls: ['./sub-section.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubSectionComponent {
	@Input()
	header!: string;
}