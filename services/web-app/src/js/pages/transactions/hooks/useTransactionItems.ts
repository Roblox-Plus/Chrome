import { useMemo } from 'react';
import LoadingState from '../../../enums/loadingState';
import TransactionItem from '../../../types/transaction-item';
import useTransactions from './useTransactions';
import { getCatalogLink, getGamePassLink } from '../../../utils/linkify';
import AssetType from '../../../enums/assetType';
import Transaction from '../../../types/transaction';

const getItemUrl = (transaction: Transaction): URL | undefined => {
  if (transaction.item_type === 'Game Pass') {
    return getGamePassLink(transaction.item_id, transaction.item_name);
  }

  if (transaction.item_type === 'Developer Product') {
    return new URL(
      `https://create.roblox.com/dashboard/creations/experiences/${transaction.universe_id}/developer-products/${transaction.item_id}/configure`
    );
  }

  if (transaction.item_type === 'Private Server Product') {
    return new URL(
      `https://create.roblox.com/dashboard/creations/experiences/${transaction.universe_id}/overview`
    );
  }

  if (Object.keys(AssetType).includes(transaction.item_type)) {
    return getCatalogLink(transaction.item_id, transaction.item_name);
  }

  return undefined;
};

const isResaleTransaction = (transaction: Transaction): boolean => {
  if (transaction.gross_revenue === 0) {
    // The gross price was free, must not be a resale... right?
    return false;
  }

  // HACK: Determine if the transaction is from a resale, by checking if the creator
  // received only 10% of the revenue for this transaction.
  // If the gross revenue for this transaction is over 10, subtract one, to account for
  // the 10% fee rounding up.
  let netRevenue =
    transaction.net_revenue - (transaction.gross_revenue > 10 ? 1 : 0);
  return netRevenue <= transaction.gross_revenue * 0.1;
};

export default function useTransactionItems(
  startDate: Date,
  endDate: Date
): [TransactionItem[], LoadingState] {
  const [transactions, loadingState] = useTransactions(startDate, endDate);
  const items = useMemo<TransactionItem[]>(() => {
    const transactionItems: { [key: string]: TransactionItem } = {};

    transactions.forEach((transaction) => {
      const key = `${transaction.item_type}:${transaction.item_id}`;
      const transactionItem = transactionItems[key];
      const isResale = isResaleTransaction(transaction);

      if (transactionItem) {
        transactionItem.revenue += transaction.net_revenue;

        if (isResale) {
          transactionItem.resaleTransactions.push(transaction);
        } else {
          transactionItem.saleTransactions.push(transaction);
        }
      } else {
        transactionItems[key] = {
          id: transaction.item_id,
          name: transaction.item_name,
          type: transaction.item_type,
          revenue: transaction.net_revenue,
          link: getItemUrl(transaction),
          saleTransactions: isResale ? [] : [transaction],
          resaleTransactions: isResale ? [transaction] : [],
        };
      }
    });

    const items = Object.values(transactionItems).sort((a, b) => {
      return a.saleTransactions.length + a.resaleTransactions.length <
        b.saleTransactions.length + b.resaleTransactions.length
        ? 1
        : -1;
    });

    return items;
  }, [transactions]);

  return [items, loadingState];
}