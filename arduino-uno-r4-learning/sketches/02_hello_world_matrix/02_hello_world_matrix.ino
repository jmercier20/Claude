#include <Arduino.h>           // Arduino UNO R4 (Renesas RA4M1) core
#include <ArduinoGraphics.h>   // Text/graphics primitives for the matrix
#include <Arduino_LED_Matrix.h> // 12x8 LED matrix driver (WiFi variant)

ArduinoLEDMatrix matrix;

void setup() {
  matrix.begin();

  matrix.beginDraw();
  matrix.stroke(0xFFFFFFFF);       // all LEDs on for text
  matrix.textScrollSpeed(80);      // ms per frame — lower is faster
  matrix.textFont(Font_4x6);
  matrix.beginText(0, 1, 0xFFFFFF);
  matrix.println("Hello World");
  matrix.endText(SCROLL_LEFT);     // scroll left, blocks until done
  matrix.endDraw();
}

void loop() {
  // scroll continuously
  matrix.beginDraw();
  matrix.stroke(0xFFFFFFFF);
  matrix.textScrollSpeed(80);
  matrix.textFont(Font_4x6);
  matrix.beginText(0, 1, 0xFFFFFF);
  matrix.println("Hello World");
  matrix.endText(SCROLL_LEFT);
  matrix.endDraw();
}
