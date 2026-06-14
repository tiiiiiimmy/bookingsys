Feature: Booking
  As a customer I want to book and pay
  so that my appointment is confirmed.

  @smoke
  Scenario: Customer books an available slot and payment succeeds
    Given I am on the booking page
    When I select the first available service and slot
    And I enter my customer details
    And I submit the booking
    And the payment succeeds
    Then I see the booking confirmed
    And the booking is confirmed in the database

  Scenario: Payment fails and the booking is not confirmed
    Given I am on the booking page
    When I select the first available service and slot
    And I enter my customer details
    And I submit the booking
    And the payment fails
    Then the booking is not confirmed in the database

  Scenario: A webhook with an invalid signature is rejected
    Given I am on the booking page
    When I select the first available service and slot
    And I enter my customer details
    And I submit the booking
    And a webhook with an invalid signature arrives
    Then the booking is not confirmed in the database

  Scenario: Customer books multiple slots and all are confirmed
    Given I am on the booking page
    When I select a bookable service and 2 slots
    And I enter my customer details
    And I submit the booking
    And the payment succeeds
    Then all bookings for the customer are confirmed
