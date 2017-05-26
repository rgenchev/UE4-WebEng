import {ControlType} from "./controlType";

/**
 * Definition für die Steuerungselemente eines Gerätes
 */
export class ControlUnit {
  /**
   * Name des Steuerungselements
   */
  name: string;
  /**
   * Typ des Steuerungselements (enum, boolean, continuous)
   */
  type: ControlType;
  /**
   * Aktueller Wert dieses ControlUnit
   * @type {number}
   */
  current: number = -1;
  /**
   * Spezifiziert ob dieses Steuerungselement die primäre Steuerung des dazugehörigen Gerätes darstellt
   */
  primary: boolean;

  /**
   * Mögliche Werte des Steuerungselements (wird nur für enum Typ benötigt)
   * Füllen Sie ein Dropdownauswahlmenü mit diesen Werten, um eine Falscheingabe zu verhindern
   */
  values?: [string];
  /**
   * Minimaler Wert für dieses Steuerungslement (wir nur bei Kontinuierlichem Typ benötigt)
   * Legen Sie mit diesem Wert den minimalen Wert für eine Eingabe fest, um eine Falscheingabe zu verhindern
   *
   * @type {number}
   */
  min?: number = -1;
  /**
   * Maximaler Wert für dieses Steuerungslement (wir nur bei Kontinuierlichem Typ benötigt)
   * Legen Sie mit diesem Wert den maximalen Wert für eine Eingabe fest, um eine Falscheingabe zu verhindern
   *
   * @type {number}
   */
  max?: number = -1;
  /**
   * Speichert den bisherigen Verlauf der Temperaturänderungen des Gerätes
   */
  log?: string;


}
