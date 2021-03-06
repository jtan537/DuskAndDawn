using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Inventory : MonoBehaviour
{
    private const int SLOTS = 5;

    private List<IInventoryItem> mItems = new List<IInventoryItem>();

    public event EventHandler<InventoryEventArgs> ItemAdded;

    public event EventHandler<InventoryEventArgs> ItemRemoved;

    public event EventHandler<InventoryEventArgs> ItemUsed;

    public void AddItem(IInventoryItem item)
    {
    	if (mItems.Count < SLOTS)
    	{
    		Collider collider = (item as MonoBehaviour).GetComponent<Collider>();
    		if (collider.enabled)
    		{
    			collider.enabled = false;
    			mItems.Add(item);
    			item.OnPickup();

    			if (ItemAdded != null)
    			{
    				ItemAdded(this, new InventoryEventArgs(item));
    			}
    		}
    	}
    }

    public void RemoveItem(IInventoryItem item)
    {
        if (mItems.Remove(item))
        {
            mItems.Remove(item);

            item.OnDelete(gameObject.transform);

            Collider collider = (item as MonoBehaviour).GetComponent<Collider>();
            if (collider != null)
            {
                collider.enabled = true;
            }

            if (ItemRemoved != null)
            {
                ItemRemoved(this, new InventoryEventArgs(item));
            }
        }
    }

    public List<IInventoryItem> GetItems() {
        return mItems;
    }

    public void UseItem(IInventoryItem item)
    {
        if (ItemUsed != null)
        {
            ItemUsed(this, new InventoryEventArgs(item));
        }
    }
}
