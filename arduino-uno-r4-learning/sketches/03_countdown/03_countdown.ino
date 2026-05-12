#include <Arduino.h>            // Arduino UNO R4 (Renesas RA4M1) core library
#include <ArduinoGraphics.h>    // provides text rendering and font support for the matrix
#include <Arduino_LED_Matrix.h> // driver for the 12x8 LED matrix on the UNO R4 WiFi

ArduinoLEDMatrix matrix;        // create a matrix object to control the LED display

// showText — clears the screen and draws the given string on the matrix
void showText(const char* text) {  // accepts a pointer to a string of characters
  matrix.clear();                  // wipe all LEDs off before drawing to prevent ghost pixels
  matrix.beginDraw();              // start a new drawing frame on the matrix
  matrix.stroke(0xFFFFFFFF);      // set the drawing colour to full brightness (white)
  matrix.textFont(Font_4x6);      // select the 4-pixel-wide by 6-pixel-tall built-in font
  matrix.beginText(0, 1, 0xFFFFFF); // position text at column 0, row 1 (centred vertically)
  matrix.println(text);            // write the string into the drawing buffer
  matrix.endText();                // finalise the text and send it to the matrix
  matrix.endDraw();                // commit the frame so it appears on the LEDs
}

void setup() {
  matrix.begin();                  // initialise the LED matrix hardware

  // --- Countdown 10 → 1 ---
  for (int i = 10; i >= 1; i--) { // loop from 10 down to 1, decrementing by 1 each step
    char buf[3];                   // small character buffer — big enough for "10\0"
    itoa(i, buf, 10);              // convert the integer i to a decimal string in buf
    showText(buf);                 // display the number on the matrix
    delay(1000);                   // wait 1 second (1000 ms) before showing the next number
  }

  // --- Flash "WIN" 5 times ---
  for (int f = 0; f < 5; f++) {   // repeat the flash sequence 5 times
    showText("WIN");               // display the word "WIN" on the matrix
    delay(400);                    // keep "WIN" visible for 400 ms
    matrix.clear();                // turn all LEDs off (flash off)
    delay(200);                    // leave the matrix blank for 200 ms
  }

  // --- Hold "WIN" on screen ---
  showText("WIN");                 // display "WIN" one final time and leave it on permanently
}

void loop() {
  // empty — the full sequence runs once in setup() and then stops
}
