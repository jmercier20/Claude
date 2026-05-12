# Arduino UNO R4 Learning — Claude Instructions

## Board

All code in this project targets the **Arduino UNO R4** (Minima or WiFi variant).  
MCU: Renesas RA4M1. Board package: `arduino:renesas_uno`.

## Driver / Include Rules

Always include the relevant UNO R4 drivers at the top of every sketch.  
Use the table below as a reference:

| Feature | Required include |
|---|---|
| Core (always) | `#include <Arduino.h>` |
| Wi-Fi (WiFi variant) | `#include <WiFiS3.h>` |
| 12×8 LED Matrix (WiFi variant) | `#include <Arduino_LED_Matrix.h>` |
| RTC | `#include <RTC.h>` |
| Mutex / RTOS | `#include <Arduino_FreeRTOS.h>` |
| USB HID Keyboard | `#include <Keyboard.h>` |
| USB HID Mouse | `#include <Mouse.h>` |
| I2C | `#include <Wire.h>` |
| SPI | `#include <SPI.h>` |
| CAN bus (Minima) | `#include <Arduino_CAN.h>` |

Never omit `#include <Arduino.h>` from any sketch.  
Add feature-specific includes as needed by the sketch.
