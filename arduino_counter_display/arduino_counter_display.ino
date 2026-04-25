void setup() {
  Serial.begin(9600);
}

void loop() {
  for (int i = 1; i <= 10; i++) {
    Serial.println(i);
    delay(1000);
  }

  // Pause before restarting the count
  delay(2000);
}
