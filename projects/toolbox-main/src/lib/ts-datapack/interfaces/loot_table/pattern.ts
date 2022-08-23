import { Color } from '../../enums/color';

export type IPattern = {
	pattern: string; //TODO: The Wiki says this should be the pattern type name ("square_bottom_left"), but the linked page talks about letter-codes.
	color: Color;
};
