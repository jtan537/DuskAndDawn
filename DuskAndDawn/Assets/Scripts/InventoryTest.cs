using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class InventoryTest : MonoBehaviour
{
    private const int SLOTS = 2;

    private List<InventoryItem> mItems = new List<InventoryItem>();

    public event EventHandler<InventoryEventArgs> ItemAdded;

    public event EventHandler<InventoryEventArgs> ItemRemoved;

    public event EventHandler<InventoryEventArgs> ItemUsed;

    public void AddItem(InventoryItem item)
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

    public void RemoveItem(InventoryItem item)
    {
        if (mItems.Remove(item))
        {
            mItems.Remove(item);

            // item.OnDrop();

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

    public void UseItem(InventoryItem item)
    {
        if (ItemUsed != null)
        {
            ItemUsed(this, new InventoryEventArgs(item));
        }
    }
}
