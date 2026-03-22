import { Tile } from './tile';

export interface Row {
  tiles: Tile[];
  submitted: boolean;
}
