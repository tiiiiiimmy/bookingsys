Feature: Reschedule a booking
  As a customer I want to request a new time
  and have an admin approve it.

  Scenario: Customer requests a reschedule and admin approves it
    Given a confirmed booking exists with a manage token
    When the customer requests a new date via the manage link
    And the admin approves the reschedule request
    Then the reschedule request is approved in the database
