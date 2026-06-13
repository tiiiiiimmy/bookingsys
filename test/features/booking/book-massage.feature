Feature: Book a massage
  As a customer I want to book and pay for a massage
  so that my appointment is confirmed.

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
