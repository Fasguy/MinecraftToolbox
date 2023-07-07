import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NetRequestService } from '../../services/net-request/net-request.service';

@Component({
	selector: 'tbx-music-area',
	templateUrl: './music-area.component.html',
	styleUrls: ['./music-area.component.scss']
})
export class MusicAreaComponent implements AfterViewInit, OnDestroy {
	@ViewChild("note")
	private _note!: ElementRef<HTMLElement>;
	private _audio: HTMLAudioElement = new Audio();
	private _possibleTracks?: AudioMetadata[];

	protected playingAudio?: AudioMetadata;

	public constructor(
		private _netRequest: NetRequestService
	) {
		this._audio.onpause = () => {
			this.playingAudio = undefined;
		}

		this._audio.onended = this.jukeboxClick.bind(this);
	}

	public async ngAfterViewInit(): Promise<void> {
		let animationListener = (e: AnimationEvent) => {
			(<HTMLElement>e.target).style.backgroundColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
		};

		animationListener(<AnimationEvent><unknown>{ target: this._note.nativeElement });
		this._note.nativeElement.addEventListener("animationstart", animationListener);
		this._note.nativeElement.addEventListener("animationiteration", animationListener);

		let data = await firstValueFrom(this._netRequest.get<AudioDefinitions[]>("resources/data/audio.json"));
		this._possibleTracks = data
			.filter(x => x.type === "music")
			.flatMap(x => x.audio)
			.filter(x => !x.tags.includes("never"));
	}

	public ngOnDestroy(): void {
		this._audio.pause();
	}

	protected async jukeboxClick() {
		if (!this._possibleTracks) return;

		if (!this._audio.paused) {
			this._audio.pause();
		} else {
			let track: AudioMetadata | undefined;
			do {
				track = this._possibleTracks[Math.floor(Math.random() * this._possibleTracks.length)];
				if (track.tags.includes("rare") && Math.floor(Math.random() * 1000) !== 0) {
					track = undefined;
				}
			} while (!track);

			this._audio.src = track.file;
			await this._audio.play();

			this.playingAudio = track;
		}
	}
}

interface AudioDefinitions {
	collection: string;
	type: string;
	audio: AudioMetadata[];
}

interface AudioMetadata {
	file: string;
	artist: string;
	title: string;
	link: string;
	tags: string[];
}