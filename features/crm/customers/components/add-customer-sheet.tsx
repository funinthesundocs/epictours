"use client";

import { SidePanel } from "@/components/ui/side-panel";
import { AddCustomerForm } from "./add-customer-form";
import { Customer } from "../types";

export function AddCustomerSheet({
    onCustomerAdded,
    isOpen,
    onClose,
    editingCustomer
}: {
    onCustomerAdded: () => void;
    isOpen: boolean;
    onClose: () => void;
    editingCustomer?: Customer;
}) {

    const handleSuccess = () => {
        onCustomerAdded();
        onClose();
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={editingCustomer ? "Edit Customer" : "Add New Customer"}
            description={editingCustomer ? "Update the customer profile below." : "Enter the details below to create a new customer profile."}
            width="max-w-lg"
        >
            <AddCustomerForm
                onSuccess={handleSuccess}
                onCancel={onClose}
                initialData={editingCustomer}
            />
        </SidePanel>
    );
}
