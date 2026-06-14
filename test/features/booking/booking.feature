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

  Scenario: Payment failure is shown on the confirmation page
    Given I am on the booking page
    When I select the first available service and slot
    And I enter my customer details
    And I submit the booking
    And the payment fails
    And I open the booking confirmation page
    Then I see the payment marked failed

  Scenario: Confirmation page updates from processing to confirmed
    Given I am on the booking page
    When I select the first available service and slot
    And I enter my customer details
    And I submit the booking
    And I open the booking confirmation page
    Then I see the booking still processing
    When the payment succeeds
    Then I see the booking confirmed

  Scenario: A slot taken by a confirmed booking is not offered
    Given a confirmed booking already occupies a slot next week
    And I am on the booking page
    When I view next week for the bookable service
    Then the occupied slot is no longer offered

  Scenario Outline: Booking form rejects invalid customer details
    Given I am on the booking page
    When I select the first available service and slot
    And I enter customer details with an invalid "<field>"
    And I submit the booking form expecting a client-side error
    Then no booking is created for the customer

    Examples:
      | field       |
      | firstName   |
      | lastName    |
      | email       |
      | phone       |
      | emailFormat |

  Scenario: The availability API rejects a past date
    When I request availability for a past date
    Then the availability request is rejected because the date is in the past

  Scenario: The availability API rejects a non-30-minute duration
    When I request availability with a 45-minute duration
    Then the availability request is rejected because the duration is invalid

  Scenario: A closed day offers no booking slots
    Given I am on the booking page
    When I view next week for the bookable service
    Then the closed day next week offers no slots

  Scenario: Slots are offered at the opening and closing boundaries
    When I request availability for an open day next week
    Then a slot starts at the opening time
    And a slot ends at the closing time

  Scenario: A blocked period removes its overlapping slot
    Given an admin blocks the first open slot next week
    Then the blocked slot is no longer available
