using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;

public class ItemDropHandler : MonoBehaviour, IDropHandler
{
    public Inventory inventory;
    public Transform panel;
    public bool active = false;

    public void OnDrop(PointerEventData eventData)
    {
        RectTransform invPanel = panel as RectTransform;

        if (!RectTransformUtility.RectangleContainsScreenPoint(invPanel, Input.mousePosition))
        {
      //   	ItemDragHandler dragHandler = 
    		// gameObject.transform.Find("Item").GetComponent<ItemDragHandler>();
      //       IInventoryItem item = dragHandler.Item;
      //       item.OnDrop();
      //       inventory.RemoveItem(item);
            Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
            RaycastHit hit;
            // Casts the ray and get the first game object hit
            Physics.Raycast(ray, out hit);
            if (hit.transform.name == "Collider")
            {
                ItemDragHandler dragHandler = 
                    gameObject.transform.Find("Item").GetComponent<ItemDragHandler>();
                IInventoryItem item = dragHandler.Item;
                if (active && item.Name == "Sun")
                {
                    inventory.UseItem(item);
                    inventory.RemoveItem(item);
                }
            }
        }
    }
}