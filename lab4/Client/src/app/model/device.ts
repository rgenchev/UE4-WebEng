import {ControlUnit} from './controlUnit'

/**
 * Definition eines Gerätes zur Repräsentation eines existierenden Smart Devices
 */
export class Device {
  /**
   * Eindeutiger Identifkator für dieses Gerät
   */
  id: string;
  /**
   * Anzeigename des Gerätes, veränderbar durch Benutzer
   */
  display_name: string;
  /**
   * Typ des Gerätes (Beleuchtung, Heizkörperthermostat, Überwachungskamera, Rollladen, Webcam)
   */
  type: string;
  /**
   * Genauere Beschreibung des Gerätetypes (bspw. Gerätenummer etc.)
   */
  type_name: string;
  /**
   * SVG-Grafik zur Anzeige auf Übersichtsseite
   */
  image: string;
  /**
   * Beschreibung für obiges image (titel von anchor tag)
   */
  description: string;
  /**
   * Alternativer Text für obiges image
   */
  image_alt: string;
  /**
   * Liste aller Steuerungselemente für dieses Gerät
   */
  control_units?: [ControlUnit];
  /**
   * JavaScript Funktion zum Anzeigen der SVG-Grafik
   * Dieser Variable hält eine Referenz auf die entsprechende Funktion in Ihrer animations.js
   */
  draw_image?: Function;
  /**
   * JavaScript Funktion zum Animieren der SVG-Grafik
   * Dieser Variable hält eine Referenz auf die entsprechende Animations-Funktion in Ihrer animations.js
   */
  update_image?: Function;
}
