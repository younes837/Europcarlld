"use client";
import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fr } from "date-fns/locale";
import { Input } from "./input";

export function DatePickerComponent({ date, setDate }) {
  return (
    <DatePicker
      selected={date}
      onChange={(date) => setDate(date)}
      dateFormat="dd/MM/yyyy"
      locale={fr}
      customInput={<Input />}
      className="w-full"
      placeholderText="Sélectionner une date"
      isClearable
      showYearDropdown
      scrollableYearDropdown
      yearDropdownItemNumber={10}
    />
  );
} 