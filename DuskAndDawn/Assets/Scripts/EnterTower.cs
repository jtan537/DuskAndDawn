using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;

public class EnterTower : MonoBehaviour
{

    public int dawnGemsPickedUp = 0, duskGemsPickedUp = 0;
    public int dawnRequiredGems = 3, duskRequiredGems = 3;
    List<PlayerEnterTowerCheck> children;
    // Start is called before the first frame update
    void Start()
    {
        foreach (Transform child in transform)
            children.Add(child.gameObject.GetComponent<PlayerEnterTowerCheck>());
    }

    // Update is called once per frame
    void Update()
    {
        if (children.All(child => child.enteringTower) && dawnGemsPickedUp == dawnRequiredGems && duskGemsPickedUp == duskRequiredGems)
        {
            print("ENTERTOWER");
        }
    }
}
