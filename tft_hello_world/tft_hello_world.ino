#include <Adafruit_GFX.h>
#include <MCUFRIEND_kbv.h>

MCUFRIEND_kbv tft;

#define BLACK 0x0000
#define WHITE 0xFFFF

void setup() {
  uint16_t id = tft.readID();
  tft.begin(id);

  tft.fillScreen(BLACK);
  tft.setTextColor(WHITE);
  tft.setTextSize(3);
  tft.setCursor(60, 100);
  tft.println("Hello World");
}

void loop() {
  // Nothing to do
}
