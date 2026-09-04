-- AlterTable
-- Recreate FK on Ticket.clienteId so deleting a User cascades to its tickets,
-- which also cascades to their comments and attachments.

ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_clienteId_fkey";

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
