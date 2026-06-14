Feature: Booking concurrency and hold expiry
  As the system I want to protect a slot once it is held or paid
  so that two customers cannot end up confirmed on the same time.

  Scenario: A held slot is blocked for a second customer
    Given customer A holds a slot next week without paying
    When customer B attempts to book the same slot
    Then customer B is rejected with a slot conflict

  Scenario: First paid booking wins and the second is cancelled
    Given customer A has paid and confirmed a slot next week
    When customer B pays for the same slot
    Then customer A's booking stays confirmed
    And customer B's booking is cancelled for review

  Scenario: A payment that succeeds after the hold expires is cancelled
    Given a booking whose hold has expired
    When the expired booking's payment succeeds
    Then the booking is cancelled for review
    And the payment is recorded as succeeded
