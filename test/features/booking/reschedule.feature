Feature: Reschedule a booking
  As a customer I want to request a new time
  and have an admin approve it.

  Scenario: Customer requests a reschedule and admin approves it
    Given a confirmed booking exists with a manage token
    When the customer requests a new date via the manage link
    And the admin approves the reschedule request
    Then the reschedule request is approved in the database

  Scenario: Customer views the manage page and submits a reschedule request
    Given a confirmed booking exists with a manage token
    When the customer opens the manage page
    Then the manage page shows the booking summary and history
    When the customer submits a reschedule request for next week
    Then the booking has one pending reschedule request

  Scenario: An unknown manage token shows a load error
    When the customer opens the manage page with an unknown token
    Then the manage page shows a load error and no reschedule form

  Scenario: A cancelled booking cannot be rescheduled
    Given a cancelled booking exists with a manage token
    When the customer opens the manage page
    Then the reschedule form is disabled

  Scenario: A second reschedule request is rejected while one is pending
    Given a confirmed booking exists with a manage token
    When the customer opens the manage page
    And the customer submits a reschedule request for next week
    And the customer submits a second reschedule request for next week
    Then the booking has one pending reschedule request

  Scenario: A reschedule request is rejected when the target slot becomes taken
    Given a confirmed booking exists with a manage token
    When the customer opens the manage page
    And the customer picks the first available slot next week
    And another booking takes that slot before submission
    And the customer submits the reschedule request expecting a conflict
    Then the booking has no pending reschedule request

  Scenario: Admin approves a reschedule request via the UI
    Given a confirmed booking exists with a manage token
    And the customer has requested a reschedule
    And I am authenticated as admin
    When I open the admin bookings page
    And the admin approves the customer's reschedule request
    Then the reschedule request shows as approved
    And the booking time matches the approved request

  Scenario: Admin rejects a reschedule request via the UI
    Given a confirmed booking exists with a manage token
    And the customer has requested a reschedule
    And I am authenticated as admin
    When I open the admin bookings page
    And the admin rejects the customer's reschedule request
    Then the reschedule request shows as rejected
    And the booking time is unchanged
