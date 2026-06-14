Feature: Admin booking management
  As an administrator I want to search, inspect, and reschedule bookings
  so that I can manage customer appointments.

  Scenario: Admin filters bookings by status and customer email
    Given a confirmed booking exists for admin management
    And I am authenticated as admin
    When I open the admin bookings page
    And I filter admin bookings by confirmed status and that customer email
    Then the admin booking list includes that customer
    When I filter admin bookings by cancelled status and that customer email
    Then the admin booking list excludes that customer

  Scenario: Admin opens booking detail
    Given a confirmed booking exists for admin management
    And I am authenticated as admin
    When I open the admin bookings page
    And I filter admin bookings by confirmed status and that customer email
    And I open that customer's admin booking detail
    Then the admin booking detail shows the customer, service, payment, token, and requests

  Scenario: Admin manually reschedules a booking
    Given a confirmed booking exists for admin management
    And I am authenticated as admin
    When I open the admin bookings page
    And I filter admin bookings by confirmed status and that customer email
    And I open that customer's admin booking detail
    And I manually reschedule the booking to a valid slot
    Then the admin booking is rescheduled in the database
    When I manually reschedule the booking with a duration mismatch
    Then the admin reschedule is rejected with a duration error
    And the admin booking time is unchanged

  Scenario: Admin manages business hours and availability blocks
    Given I am authenticated as admin
    When I open the admin availability page
    And I close Monday business hours
    Then Monday public availability has no slots
    When I reopen Monday business hours from "09:00" to "17:00"
    Then Monday public availability includes the opening slot
    When I create an availability block for the opening slot
    Then the blocked opening slot is unavailable
    When I delete the availability block
    Then Monday public availability includes the opening slot

  Scenario: Admin availability rejects invalid inputs
    Given I am authenticated as admin
    When I open the admin availability page
    And I try to create an invalid availability block
    Then I see an availability error containing "End time must be after start time"
    When I create an availability block for the opening slot
    And I delete that availability block twice
    Then I see an availability error containing "Availability block not found"
