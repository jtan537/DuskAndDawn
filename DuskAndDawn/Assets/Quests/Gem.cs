using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Gem : InventoryItemBase
{
    [SerializeField]
    GameObject _shadow;

    EnterTower enterTower;

    public bool pickedUp = false;
    public override void OnPickup(Collider collider)
    {
        collider.enabled = false;
        gameObject.GetComponent<MeshRenderer>().enabled = false;
        gameObject.GetComponent<BoxCollider>().enabled = false;
        pickedUp = true;
        if (_shadow)
        {
            _shadow.SetActive(false);
        }
        GetComponent<AudioSource>().Play();
        if (gameObject.tag == "Dawn")
        {
            enterTower.dawnGemsPickedUp += 1;
        } else if (gameObject.tag == "Dusk")
        {
            enterTower.duskGemsPickedUp += 1;
        } else 
        {
            Debug.LogError("Gem must be tagged Dawn or Dusk");
        }
        
    }

    public override string Name
    {
    	get
    	{
    		return "Gem";
    	}
    }
    public override string Description
    {
        get
        {
            return "A gem that is extremely valuable. Rumours have it that collecting four of them will unlock something special.";
        }
    }
}
